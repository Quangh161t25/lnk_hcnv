import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CalendarRange, Download, ListChecks, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormFooter, FormGrid, FormSection, TableSection, subTh, subThActions, subTdActions } from '@/components/ui/Sections';
import { useSheetTable } from '@/lib/sheetTable';
import { useEmployeeStore } from '@/stores/employees';
import departmentsSeed from '@/data/departments.json';
import {
  LOAI_KY_LABEL,
  UU_TIEN,
  currentPeriod,
  periodCount,
  periodLabel,
  periodRange,
  usePlanAction,
  type LoaiKy,
  type Me,
  type Plan,
  type PlanItem,
} from './data';

interface Department {
  id: string;
  ten_phong_ban: string;
  ma_phong_ban: string;
  cap_do: number;
}

const itemSchema = z.object({
  id: z.string().optional(),
  ten_viec: z.string(),
  muc_tieu: z.string(),
  phu_trach: z.string(),
  han: z.string(),
  uu_tien: z.string(),
  trong_so: z.coerce.number().min(0).max(100),
  ghi_chu: z.string(),
  nguon_id: z.string().optional(),
});
const schema = z.object({
  loai: z.enum(['ca_nhan', 'phong_ban']),
  phong_ban_id: z.string().min(1, 'Vui lòng chọn phòng ban'),
  loai_ky: z.enum(['tuan', 'thang', 'quy']),
  nam: z.coerce.number().min(2000).max(2100),
  so_ky: z.coerce.number().min(1),
  tieu_de: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  muc_tieu: z.string(),
  items: z.array(itemSchema).refine((a) => a.some((i) => i.ten_viec.trim()), 'Kế hoạch cần ít nhất một đầu việc'),
});
type FormValues = z.infer<typeof schema>;

const emptyItem = (phuTrach = ''): FormValues['items'][number] => ({ ten_viec: '', muc_tieu: '', phu_trach: phuTrach, han: '', uu_tien: 'Trung bình', trong_so: 0, ghi_chu: '' });
const cell = 'px-2 py-1.5 align-top';
const cellInput = 'h-9 text-sm w-full min-w-0';

export function KeHoachForm({ initialData, me, plans, onClose }: { initialData: Plan | null; me: Me; plans: Plan[]; onClose: () => void }) {
  const isEdit = !!initialData;
  const action = usePlanAction(onClose);
  const { rows: departments } = useSheetTable<Department>('departments', departmentsSeed as Department[]);
  const employees = useEmployeeStore((s) => s.employees);
  const canDeptPlan = me.role === 'admin' || me.quan_ly.length > 0;
  const now = currentPeriod('thang');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? { ...initialData, items: initialData.items.map((i) => ({ ...emptyItem(), ...i, nguon_id: i.nguon_id ?? '' })) }
      : { loai: 'ca_nhan', phong_ban_id: '', loai_ky: 'thang', nam: now.nam, so_ky: now.so_ky, tieu_de: '', muc_tieu: '', items: [emptyItem(me.ma_nv)] },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const [loai, loaiKy, nam, soKy, phongBanId, items] = useWatch({ control, name: ['loai', 'loai_ky', 'nam', 'so_ky', 'phong_ban_id', 'items'] });
  const [titleTouched, setTitleTouched] = useState(isEdit);

  const deptOptions = useMemo(
    () =>
      departments
        .filter((d) => loai !== 'phong_ban' || me.role === 'admin' || me.quan_ly.includes(d.id))
        .map((d) => ({ label: `${d.cap_do > 1 ? '— ' : ''}${d.ten_phong_ban}`, value: d.id, subLabel: d.ma_phong_ban })),
    [departments, loai, me],
  );
  const employeeOptions = useMemo(() => [{ label: '—', value: '' }, ...employees.map((e) => ({ label: e.ho_ten, value: e.ma_nv, subLabel: e.ma_nv }))], [employees]);
  const kyOptions = useMemo(() => {
    const n = periodCount(loaiKy as LoaiKy, Number(nam) || now.nam);
    return Array.from({ length: n }, (_, i) => ({ label: periodLabel({ loai_ky: loaiKy as LoaiKy, nam: Number(nam) || now.nam, so_ky: i + 1 }, true), value: String(i + 1) }));
  }, [loaiKy, nam, now.nam]);

  // Đổi loại kỳ/năm: giữ số kỳ trong giới hạn, mặc định là kỳ hiện tại.
  useEffect(() => {
    if (isEdit) return;
    const cur = currentPeriod(loaiKy as LoaiKy);
    setValue('so_ky', cur.so_ky);
  }, [loaiKy, isEdit, setValue]);
  useEffect(() => {
    const n = periodCount(loaiKy as LoaiKy, Number(nam));
    if (Number(getValues('so_ky')) > n) setValue('so_ky', n);
  }, [loaiKy, nam, getValues, setValue]);

  // Tiêu đề tự gợi ý cho đến khi người dùng tự sửa.
  const deptName = departments.find((d) => d.id === phongBanId)?.ten_phong_ban ?? '';
  const myName = employees.find((e) => e.ma_nv === me.ma_nv)?.ho_ten ?? me.ma_nv;
  useEffect(() => {
    if (titleTouched) return;
    const ky = periodLabel({ loai_ky: loaiKy as LoaiKy, nam: Number(nam), so_ky: Number(soKy) });
    setValue('tieu_de', `Kế hoạch ${ky.charAt(0).toLowerCase()}${ky.slice(1)} – ${loai === 'phong_ban' ? deptName || 'phòng ban' : myName}`);
  }, [loai, loaiKy, nam, soKy, deptName, myName, titleTouched, setValue]);

  const totalWeight = (items ?? []).reduce((s, i) => s + (Number(i.trong_so) || 0), 0);

  // Kế hoạch phòng ban đã duyệt cùng phòng, giao thoa thời gian với kỳ đang lập.
  const range = periodRange(loaiKy as LoaiKy, Number(nam), Number(soKy));
  const sourcePlans = plans.filter(
    (p) => p.loai === 'phong_ban' && p.trang_thai === 'Đã duyệt' && p.id !== initialData?.id && p.tu_ngay <= range.den_ngay && p.den_ngay >= range.tu_ngay && (!phongBanId || p.phong_ban_id === phongBanId),
  );
  const [pickOpen, setPickOpen] = useState(false);
  const importFrom = (p: Plan) => {
    const mine = p.items.filter((i) => i.phu_trach?.toLowerCase() === me.ma_nv.toLowerCase());
    const take = mine.length ? mine : p.items;
    const have = new Set(getValues('items').map((i) => i.nguon_id).filter(Boolean));
    const add = take.filter((i) => !have.has(i.id)).map((i) => ({ ...emptyItem(me.ma_nv), ten_viec: i.ten_viec, muc_tieu: i.muc_tieu, han: i.han, uu_tien: i.uu_tien, trong_so: i.trong_so, nguon_id: i.id ?? '' }));
    const current = getValues('items').filter((i) => i.ten_viec.trim());
    replace([...current, ...add]);
    if (!phongBanId) setValue('phong_ban_id', p.phong_ban_id);
    setPickOpen(false);
    toast.success(add.length ? `Đã thêm ${add.length} đầu việc từ "${p.tieu_de}"` : 'Các đầu việc này đã có trong kế hoạch');
  };

  const submit = (v: FormValues) => {
    const r = periodRange(v.loai_ky, v.nam, v.so_ky);
    action.mutate({
      action: 'save',
      doc: { id: initialData?.id, loai: v.loai, loai_ky: v.loai_ky, nam: v.nam, so_ky: v.so_ky, ...r, phong_ban_id: v.phong_ban_id, ten_phong_ban: deptName, tieu_de: v.tieu_de.trim(), muc_tieu: v.muc_tieu.trim() },
      items: v.items.filter((i) => i.ten_viec.trim()) as PlanItem[],
    });
  };

  return (
    <Drawer
      title={isEdit ? 'Sửa kế hoạch' : 'Lập kế hoạch'}
      subtitle={isEdit ? initialData.id : undefined}
      icon={<CalendarRange size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={<FormFooter formId="ke-hoach-form" onCancel={onClose} isLoading={action.isPending} isEdit={isEdit} saveLabel="Lưu kế hoạch" createLabel="Lưu nháp" />}
    >
      <form id="ke-hoach-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title="Thông tin kế hoạch" icon={<Building2 size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Select
                  label="Loại kế hoạch"
                  required
                  options={[{ label: 'Cá nhân', value: 'ca_nhan' }, ...(canDeptPlan ? [{ label: 'Phòng ban', value: 'phong_ban' }] : [])]}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    if (v === 'phong_ban' && phongBanId && me.role !== 'admin' && !me.quan_ly.includes(phongBanId)) setValue('phong_ban_id', '');
                  }}
                  searchable={false}
                  disabled={isEdit}
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="phong_ban_id"
              control={control}
              render={({ field }) => (
                <Select label="Phòng ban" required options={deptOptions} value={field.value} onChange={field.onChange} placeholder="Chọn phòng ban" error={errors.phong_ban_id?.message} dropdownInPortal />
              )}
            />
            <Controller
              name="loai_ky"
              control={control}
              render={({ field }) => (
                <Select
                  label="Kỳ kế hoạch"
                  required
                  options={(Object.keys(LOAI_KY_LABEL) as LoaiKy[]).map((k) => ({ label: LOAI_KY_LABEL[k], value: k }))}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 min-w-0">
              <Input label="Năm" type="number" required {...register('nam')} error={errors.nam?.message} />
              <Controller
                name="so_ky"
                control={control}
                render={({ field }) => (
                  <Select label={LOAI_KY_LABEL[loaiKy as LoaiKy]} required options={kyOptions} value={String(field.value)} onChange={(v) => field.onChange(Number(v))} dropdownInPortal />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input label="Tiêu đề" required {...register('tieu_de', { onChange: () => setTitleTouched(true) })} error={errors.tieu_de?.message} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea label="Mục tiêu chung" placeholder="Mục tiêu trọng tâm của kỳ (tùy chọn)" rows={3} {...register('muc_tieu')} />
            </div>
          </FormGrid>
        </FormSection>

        <TableSection title="Đầu việc" icon={<ListChecks size={14} className="text-primary" />} count={fields.length} addLabel="Thêm dòng" onAdd={() => append(emptyItem(loai === 'ca_nhan' ? me.ma_nv : ''))} maxTableHeight="420px">
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className={subTh}>#</th>
              <th className={`${subTh} min-w-[200px]`}>Tên đầu việc *</th>
              <th className={`${subTh} min-w-[160px]`}>Mục tiêu / Chỉ số</th>
              <th className={`${subTh} min-w-[170px]`}>Phụ trách</th>
              <th className={`${subTh} min-w-[140px]`}>Thời hạn</th>
              <th className={`${subTh} min-w-[120px]`}>Ưu tiên</th>
              <th className={`${subTh} min-w-[90px]`}>Trọng số %</th>
              <th className={subThActions}>Xóa</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.map((f, i) => (
              <tr key={f.id}>
                <td className={`${cell} pt-3.5 text-muted-foreground tabular-nums`}>
                  {i + 1}
                  {getValues(`items.${i}.nguon_id`) ? <span className="block text-[10px] text-sky-600" title="Nhận từ kế hoạch phòng ban">PB</span> : null}
                </td>
                <td className={cell}>
                  <Input className={cellInput} placeholder="Tên đầu việc" {...register(`items.${i}.ten_viec`)} />
                </td>
                <td className={cell}>
                  <Input className={cellInput} placeholder="VD: 100% / 20 khách" {...register(`items.${i}.muc_tieu`)} />
                </td>
                <td className={cell}>
                  <Controller name={`items.${i}.phu_trach`} control={control} render={({ field }) => <Select options={employeeOptions} value={field.value} onChange={field.onChange} placeholder="Chọn" dropdownInPortal />} />
                </td>
                <td className={cell}>
                  <Input className={cellInput} type="date" {...register(`items.${i}.han`)} />
                </td>
                <td className={cell}>
                  <Controller
                    name={`items.${i}.uu_tien`}
                    control={control}
                    render={({ field }) => <Select options={UU_TIEN.map((u) => ({ label: u, value: u }))} value={field.value} onChange={field.onChange} searchable={false} dropdownInPortal />}
                  />
                </td>
                <td className={cell}>
                  <Input className={cellInput} type="number" min={0} max={100} {...register(`items.${i}.trong_so`)} />
                </td>
                <td className={subTdActions}>
                  <button type="button" onClick={() => remove(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md" title="Xóa dòng" aria-label="Xóa dòng">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableSection>
        <div className="flex flex-wrap items-center justify-between gap-2 -mt-2 px-1">
          <p className={`text-xs ${totalWeight === 100 || totalWeight === 0 ? 'text-muted-foreground' : 'text-amber-600'}`}>
            <Target size={12} className="inline mr-1" />
            Tổng trọng số: <b>{totalWeight}%</b>
            {totalWeight !== 100 && totalWeight !== 0 ? ' (nên bằng 100%)' : ''}
          </p>
          {loai === 'ca_nhan' && (
            <div className="relative">
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setPickOpen((o) => !o)}>
                <Download size={13} /> Nhận việc từ kế hoạch phòng ban
              </Button>
              {pickOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPickOpen(false)} aria-hidden />
                  <div className="absolute right-0 bottom-full mb-1 w-80 max-h-72 overflow-auto rounded-lg border border-border bg-popover shadow-lg z-20 py-1">
                    {sourcePlans.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground">Chưa có kế hoạch phòng ban đã duyệt trùng thời gian {phongBanId ? 'của phòng này' : ''}.</p>
                    ) : (
                      sourcePlans.map((p) => (
                        <button key={p.id} type="button" onClick={() => importFrom(p)} className="w-full text-left px-3 py-2 hover:bg-muted">
                          <span className="block text-sm font-medium text-foreground truncate">{p.tieu_de}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.ten_phong_ban} · {p.items.length} đầu việc · {p.items.filter((i) => i.phu_trach?.toLowerCase() === me.ma_nv.toLowerCase()).length} giao cho bạn
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {errors.items?.root?.message || errors.items?.message ? <p className="text-sm text-destructive px-1">{errors.items?.root?.message ?? errors.items?.message}</p> : null}
      </form>
    </Drawer>
  );
}
