import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CalendarRange, FileChartColumn, Layers, ListChecks, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormFooter, FormGrid, FormSection, TableSection, subTh, subThActions, subTdActions } from '@/components/ui/Sections';
import { useSheetTable } from '@/lib/sheetTable';
import { useEmployeeStore } from '@/stores/employees';
import departmentsSeed from '@/data/departments.json';
import { currentPeriod, periodCount, periodLabel, periodRange, type Plan } from '../ke-hoach/data';
import type { Me } from '../workflowData';
import { SECTIONS, completion, completionColor, useReportAction, type Phan, type Report, type ReportItem } from './data';

interface Department {
  id: string;
  ten_phong_ban: string;
  ma_phong_ban: string;
  cap_do: number;
  cha_id?: string | null;
}

const itemSchema = z.object({
  id: z.string().optional(),
  phan: z.enum(['A', 'B', 'C', 'D']),
  noi_dung: z.string(),
  ket_qua: z.string(),
  phan_tram: z.coerce.number().min(0).max(100).optional(),
  trong_so: z.coerce.number().min(0).max(100).optional(),
  phu_trach: z.string().optional(),
  han: z.string().optional(),
  da_xu_ly: z.boolean().optional(),
  ghi_chu: z.string().optional(),
  nguon_id: z.string().optional(),
});
const schema = z.object({
  loai: z.enum(['ca_nhan', 'phong_ban']),
  phong_ban_id: z.string().min(1, 'Vui lòng chọn phòng ban'),
  loai_ky: z.enum(['tuan', 'thang']),
  nam: z.coerce.number().min(2000).max(2100),
  so_ky: z.coerce.number().min(1),
  tieu_de: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  ke_hoach_id: z.string(),
  tom_tat: z.string(),
  items: z.array(itemSchema).refine((a) => a.some((i) => i.phan === 'A' && i.noi_dung.trim()), 'Cần ít nhất một kết quả công việc ở phần A'),
});
type FormValues = z.infer<typeof schema>;
type ItemValues = FormValues['items'][number];

const blank = (phan: Phan, extra: Partial<ItemValues> = {}): ItemValues => ({ phan, noi_dung: '', ket_qua: '', phan_tram: 0, trong_so: 0, phu_trach: '', han: '', da_xu_ly: false, ghi_chu: '', nguon_id: '', ...extra });
const cell = 'px-2 py-1.5 align-top';
const cellInput = 'h-9 text-sm w-full min-w-0';

/** Các cột nhập cho từng phần A–D. */
const COLUMNS: Record<Phan, { a: string; b: string }> = {
  A: { a: 'Công việc *', b: 'Kết quả / Chỉ số' },
  B: { a: 'Vấn đề phát sinh', b: 'Biện pháp / Đề xuất xử lý' },
  C: { a: 'Đầu việc kỳ sau', b: 'Mục tiêu' },
  D: { a: 'Đề xuất', b: 'Nội dung trình bày' },
};

function SectionTable({
  phan,
  rows,
  register,
  control,
  employeeOptions,
  onAdd,
  onRemove,
}: {
  phan: Phan;
  rows: { index: number; key: string; fromPlan: boolean }[];
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  employeeOptions: { label: string; value: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const sec = SECTIONS.find((s) => s.key === phan)!;
  const col = COLUMNS[phan];
  return (
    <TableSection title={sec.title} icon={<ListChecks size={14} className="text-primary" />} count={rows.length} addLabel="Thêm dòng" onAdd={onAdd} emptyTitle="Chưa có dòng nào" emptyDescription={sec.hint} maxTableHeight="360px">
      {rows.length > 0 ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className={subTh}>#</th>
              <th className={`${subTh} min-w-[200px]`}>{col.a}</th>
              <th className={`${subTh} min-w-[180px]`}>{col.b}</th>
              {phan === 'A' && <th className={`${subTh} min-w-[96px]`}>% hoàn thành</th>}
              {phan === 'A' && <th className={`${subTh} min-w-[90px]`}>Trọng số %</th>}
              {phan === 'B' && <th className={`${subTh} min-w-[80px]`}>Đã xử lý</th>}
              {phan === 'C' && <th className={`${subTh} min-w-[170px]`}>Phụ trách</th>}
              {phan === 'C' && <th className={`${subTh} min-w-[140px]`}>Thời hạn</th>}
              <th className={subThActions}>Xóa</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {rows.map((r, k) => (
              <tr key={r.key}>
                <td className={`${cell} pt-3.5 text-muted-foreground tabular-nums`}>
                  {k + 1}
                  {r.fromPlan ? <span className="block text-[10px] text-sky-600" title="Lấy từ kế hoạch">KH</span> : null}
                </td>
                <td className={cell}>
                  <Input className={cellInput} {...register(`items.${r.index}.noi_dung`)} />
                </td>
                <td className={cell}>
                  <Input className={cellInput} {...register(`items.${r.index}.ket_qua`)} />
                </td>
                {phan === 'A' && (
                  <td className={cell}>
                    <Input className={cellInput} type="number" min={0} max={100} {...register(`items.${r.index}.phan_tram`)} />
                  </td>
                )}
                {phan === 'A' && (
                  <td className={cell}>
                    <Input className={cellInput} type="number" min={0} max={100} {...register(`items.${r.index}.trong_so`)} />
                  </td>
                )}
                {phan === 'B' && (
                  <td className={`${cell} pt-3 text-center`}>
                    <input type="checkbox" className="w-4 h-4 accent-primary" {...register(`items.${r.index}.da_xu_ly`)} />
                  </td>
                )}
                {phan === 'C' && (
                  <td className={cell}>
                    <Controller name={`items.${r.index}.phu_trach`} control={control} render={({ field }) => <Select options={employeeOptions} value={field.value ?? ''} onChange={field.onChange} placeholder="Chọn" dropdownInPortal />} />
                  </td>
                )}
                {phan === 'C' && (
                  <td className={cell}>
                    <Input className={cellInput} type="date" {...register(`items.${r.index}.han`)} />
                  </td>
                )}
                <td className={subTdActions}>
                  <button type="button" onClick={() => onRemove(r.index)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md" title="Xóa dòng" aria-label="Xóa dòng">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </>
      ) : null}
    </TableSection>
  );
}

export function BaoCaoForm({ initialData, me, reports, plans, onClose }: { initialData: Report | null; me: Me; reports: Report[]; plans: Plan[]; onClose: () => void }) {
  const isEdit = !!initialData;
  const action = useReportAction(onClose);
  const { rows: departments } = useSheetTable<Department>('departments', departmentsSeed as Department[]);
  const employees = useEmployeeStore((s) => s.employees);
  const canDeptReport = me.role === 'admin' || me.quan_ly.length > 0;
  const now = currentPeriod('tuan');

  const { register, control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          ...initialData,
          loai_ky: initialData.loai_ky === 'thang' ? 'thang' : 'tuan',
          ke_hoach_id: initialData.ke_hoach_id ?? '',
          tom_tat: initialData.tom_tat ?? '',
          items: initialData.items.map((i) => blank(i.phan, { ...i, phan_tram: i.phan_tram ?? 0, trong_so: i.trong_so ?? 0, phu_trach: i.phu_trach ?? '', han: i.han ?? '', ghi_chu: i.ghi_chu ?? '', nguon_id: i.nguon_id ?? '', da_xu_ly: !!i.da_xu_ly })),
        }
      : { loai: 'ca_nhan', phong_ban_id: '', loai_ky: 'tuan', nam: now.nam, so_ky: now.so_ky, tieu_de: '', ke_hoach_id: '', tom_tat: '', items: [blank('A')] },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const [loai, loaiKy, nam, soKy, phongBanId, keHoachId, items] = useWatch({ control, name: ['loai', 'loai_ky', 'nam', 'so_ky', 'phong_ban_id', 'ke_hoach_id', 'items'] });
  const [titleTouched, setTitleTouched] = useState(isEdit);

  const deptOptions = useMemo(
    () => departments.filter((d) => loai !== 'phong_ban' || me.role === 'admin' || me.quan_ly.includes(d.id)).map((d) => ({ label: `${d.cap_do > 1 ? '— ' : ''}${d.ten_phong_ban}`, value: d.id, subLabel: d.ma_phong_ban })),
    [departments, loai, me],
  );
  const employeeOptions = useMemo(() => [{ label: '—', value: '' }, ...employees.map((e) => ({ label: e.ho_ten, value: e.ma_nv }))], [employees]);
  const kyOptions = useMemo(() => {
    const y = Number(nam) || now.nam;
    return Array.from({ length: periodCount(loaiKy, y) }, (_, i) => ({ label: periodLabel({ loai_ky: loaiKy, nam: y, so_ky: i + 1 }, true), value: String(i + 1) }));
  }, [loaiKy, nam, now.nam]);

  useEffect(() => {
    if (!isEdit) setValue('so_ky', currentPeriod(loaiKy).so_ky);
  }, [loaiKy, isEdit, setValue]);
  useEffect(() => {
    const n = periodCount(loaiKy, Number(nam));
    if (Number(getValues('so_ky')) > n) setValue('so_ky', n);
  }, [loaiKy, nam, getValues, setValue]);

  const deptName = departments.find((d) => d.id === phongBanId)?.ten_phong_ban ?? '';
  const myName = employees.find((e) => e.ma_nv === me.ma_nv)?.ho_ten ?? me.ma_nv;
  useEffect(() => {
    if (titleTouched) return;
    const ky = periodLabel({ loai_ky: loaiKy, nam: Number(nam), so_ky: Number(soKy) });
    setValue('tieu_de', `Báo cáo ${ky.charAt(0).toLowerCase()}${ky.slice(1)} – ${loai === 'phong_ban' ? deptName || 'phòng ban' : myName}`);
  }, [loai, loaiKy, nam, soKy, deptName, myName, titleTouched, setValue]);

  const range = periodRange(loaiKy, Number(nam), Number(soKy));
  const overlaps = (d: { tu_ngay: string; den_ngay: string }) => d.tu_ngay <= range.den_ngay && d.den_ngay >= range.tu_ngay;

  // Kế hoạch đối chiếu: kế hoạch đã duyệt (hoặc đang chờ) cùng người lập / cùng phòng, giao thoa thời gian.
  const planOptions = useMemo(
    () =>
      plans
        .filter((p) => p.trang_thai !== 'Trả lại' && overlaps(p) && (loai === 'phong_ban' ? p.loai === 'phong_ban' && (!phongBanId || p.phong_ban_id === phongBanId) : p.nguoi_lap.toLowerCase() === me.ma_nv.toLowerCase()))
        .map((p) => ({ label: p.tieu_de, value: p.id, subLabel: `${p.items.length} đầu việc · ${p.trang_thai === 'Đã gửi' ? 'Chờ duyệt' : p.trang_thai}` })),
    [plans, loai, phongBanId, me.ma_nv, range.tu_ngay, range.den_ngay], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const rowsOf = (phan: Phan) => fields.map((f, index) => ({ index, key: f.id, phan: items?.[index]?.phan ?? f.phan, fromPlan: !!items?.[index]?.nguon_id })).filter((r) => r.phan === phan);
  const clean = (list: ItemValues[]) => list.filter((i) => i.noi_dung.trim());

  const importPlan = () => {
    const p = plans.find((x) => x.id === keHoachId);
    if (!p) return toast.info('Chọn kế hoạch đối chiếu trước');
    const have = new Set(getValues('items').map((i) => i.nguon_id).filter(Boolean));
    const add = p.items.filter((i) => !have.has(i.id)).map((i) => blank('A', { noi_dung: i.ten_viec, ket_qua: '', trong_so: i.trong_so, ghi_chu: i.muc_tieu ? `Mục tiêu: ${i.muc_tieu}` : '', nguon_id: i.id ?? '' }));
    replace([...clean(getValues('items')), ...add]);
    if (!phongBanId) setValue('phong_ban_id', p.phong_ban_id);
    toast.success(add.length ? `Đã thêm ${add.length} đầu việc từ kế hoạch vào phần A — hãy nhập kết quả và % hoàn thành` : 'Các đầu việc của kế hoạch đã có trong báo cáo');
  };

  // Báo cáo phòng ban: gom báo cáo cá nhân (đã gửi / đã duyệt) cùng phòng (kể cả nhóm con), cùng kỳ.
  const childIds = useMemo(() => {
    const out = new Set<string>([phongBanId]);
    let added = true;
    while (added) {
      added = false;
      for (const d of departments) if (d.cha_id && out.has(d.cha_id) && !out.has(d.id)) (out.add(d.id), (added = true));
    }
    return out;
  }, [departments, phongBanId]);
  const memberReports = reports.filter((r) => r.loai === 'ca_nhan' && r.id !== initialData?.id && childIds.has(r.phong_ban_id) && overlaps(r) && (r.trang_thai === 'Đã gửi' || r.trang_thai === 'Đã duyệt'));
  const aggregate = () => {
    if (!memberReports.length) return toast.info('Chưa có báo cáo cá nhân đã gửi của phòng trong kỳ này');
    const add = memberReports.flatMap((r) =>
      r.items
        .filter((i) => i.phan !== 'C')
        .map((i) => blank(i.phan, { noi_dung: `${i.noi_dung} (${r.ten_nguoi_lap || r.nguoi_lap})`, ket_qua: i.ket_qua, phan_tram: i.phan_tram ?? 0, trong_so: 0, da_xu_ly: !!i.da_xu_ly })),
    );
    replace([...clean(getValues('items')), ...add]);
    toast.success(`Đã tổng hợp ${add.length} dòng từ ${memberReports.length} báo cáo nhân viên`);
  };

  const pct = completion((items ?? []).filter((i) => i.noi_dung?.trim()));

  const submit = (v: FormValues) => {
    action.mutate({
      action: 'save',
      doc: { id: initialData?.id, loai: v.loai, loai_ky: v.loai_ky, nam: v.nam, so_ky: v.so_ky, ...periodRange(v.loai_ky, v.nam, v.so_ky), phong_ban_id: v.phong_ban_id, ten_phong_ban: deptName, tieu_de: v.tieu_de.trim(), ke_hoach_id: v.ke_hoach_id, tom_tat: v.tom_tat.trim() },
      items: clean(v.items) as ReportItem[],
    });
  };

  return (
    <Drawer
      title={isEdit ? 'Sửa báo cáo' : 'Lập báo cáo'}
      subtitle={isEdit ? initialData.id : undefined}
      icon={<FileChartColumn size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={<FormFooter formId="bao-cao-form" onCancel={onClose} isLoading={action.isPending} isEdit={isEdit} saveLabel="Lưu báo cáo" createLabel="Lưu nháp" />}
    >
      <form id="bao-cao-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title="Thông tin báo cáo" icon={<Building2 size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Select
                  label="Loại báo cáo"
                  required
                  options={[{ label: 'Cá nhân', value: 'ca_nhan' }, ...(canDeptReport ? [{ label: 'Phòng ban', value: 'phong_ban' }] : [])]}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('ke_hoach_id', '');
                    if (v === 'phong_ban' && phongBanId && me.role !== 'admin' && !me.quan_ly.includes(phongBanId)) setValue('phong_ban_id', '');
                  }}
                  searchable={false}
                  disabled={isEdit}
                  dropdownInPortal
                />
              )}
            />
            <Controller name="phong_ban_id" control={control} render={({ field }) => <Select label="Phòng ban" required options={deptOptions} value={field.value} onChange={field.onChange} placeholder="Chọn phòng ban" error={errors.phong_ban_id?.message} dropdownInPortal />} />
            <Controller
              name="loai_ky"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kỳ báo cáo"
                  required
                  options={[
                    { label: 'Tuần', value: 'tuan' },
                    { label: 'Tháng', value: 'thang' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 min-w-0">
              <Input label="Năm" type="number" required {...register('nam')} error={errors.nam?.message} />
              <Controller name="so_ky" control={control} render={({ field }) => <Select label={loaiKy === 'tuan' ? 'Tuần' : 'Tháng'} required options={kyOptions} value={String(field.value)} onChange={(v) => field.onChange(Number(v))} dropdownInPortal />} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input label="Tiêu đề" required {...register('tieu_de', { onChange: () => setTitleTouched(true) })} error={errors.tieu_de?.message} />
            </div>
            <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
              <Controller
                name="ke_hoach_id"
                control={control}
                render={({ field }) => (
                  <Select label="Kế hoạch đối chiếu" options={[{ label: '(Không đối chiếu)', value: '' }, ...planOptions]} value={field.value} onChange={field.onChange} placeholder={planOptions.length ? 'Chọn kế hoạch cùng kỳ' : 'Chưa có kế hoạch cùng kỳ'} dropdownInPortal />
                )}
              />
              <Button type="button" variant="outline" className="h-10 gap-1.5 text-xs" onClick={importPlan} disabled={!keHoachId}>
                <CalendarRange size={14} /> Lấy đầu việc từ kế hoạch
              </Button>
            </div>
            {loai === 'phong_ban' && (
              <div className="col-span-1 sm:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {phongBanId ? `${memberReports.length} báo cáo cá nhân đã gửi của phòng trong kỳ này` : 'Chọn phòng ban để tổng hợp báo cáo nhân viên'}
                </span>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={aggregate} disabled={!phongBanId}>
                  <Layers size={13} /> Tổng hợp từ báo cáo nhân viên
                </Button>
              </div>
            )}
          </FormGrid>
        </FormSection>

        <div className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Mức hoàn thành (phần A)</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${completionColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-bold tabular-nums w-12 text-right">{pct}%</span>
        </div>

        {SECTIONS.map((s) => (
          <SectionTable key={s.key} phan={s.key} rows={rowsOf(s.key)} register={register} control={control} employeeOptions={employeeOptions} onAdd={() => append(blank(s.key, s.key === 'C' ? { phu_trach: loai === 'ca_nhan' ? me.ma_nv : '' } : {}))} onRemove={remove} />
        ))}
        {errors.items?.root?.message || errors.items?.message ? <p className="text-sm text-destructive px-1">{errors.items?.root?.message ?? errors.items?.message}</p> : null}

        <FormSection title="Tóm tắt / nhận xét chung" icon={<FileChartColumn size={14} />}>
          <Textarea placeholder="Đánh giá chung về kỳ báo cáo (tùy chọn)" rows={3} {...register('tom_tat')} />
        </FormSection>
      </form>
    </Drawer>
  );
}
