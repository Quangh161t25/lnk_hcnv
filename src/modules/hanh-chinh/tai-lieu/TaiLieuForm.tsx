import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, FileText, Hash, Tag, Type } from 'lucide-react';
import { t } from '@/lib/i18n';
import { toInputDate } from '@/lib/format';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormFooter, FormGrid, FormSection } from '@/components/ui/Sections';
import { useDepartments } from '@/modules/shared/orgData';
import {
  HUONG_OPTIONS,
  useCreateTaiLieu,
  useLoaiTaiLieu,
  useNhomTaiLieu,
  useTrangThaiTaiLieu,
  useUpdateTaiLieu,
  type Huong,
  type TaiLieu,
  type TaiLieuInput,
} from './data';

const schema = z.object({
  ma_so: z.string().trim().max(50).optional().nullable(),
  huong: z.enum(['noi_bo', 'den', 'di'], { errorMap: () => ({ message: t('taiLieu.validation.huongRequired') }) }),
  id_loai: z.string().min(1, { message: t('taiLieu.validation.loaiRequired') }),
  id_nhom_tai_lieu: z.string().optional(),
  id_trang_thai: z.string().min(1, { message: t('taiLieu.validation.trangThaiRequired') }),
  trich_yeu: z
    .string()
    .trim()
    .min(1, { message: t('taiLieu.validation.trichYeuRequired') })
    .max(500, { message: t('taiLieu.validation.trichYeuMaxLength') }),
  so_den: z.string().trim().optional(),
  ngay_den: z.string().optional(),
  noi_gui: z.string().optional(),
  so_di: z.string().optional(),
  ngay_ky: z.string().optional(),
  noi_nhan: z.string().optional(),
  id_phong_ban: z.string().optional(),
  ghi_chu: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const blank = (huong: Huong): FormValues => ({
  ma_so: '',
  huong,
  id_loai: '',
  id_nhom_tai_lieu: '',
  id_trang_thai: '',
  trich_yeu: '',
  so_den: '',
  ngay_den: '',
  noi_gui: '',
  so_di: '',
  ngay_ky: '',
  noi_nhan: '',
  id_phong_ban: '',
  ghi_chu: '',
});

const trimOrUndefined = (v?: string) => v?.trim() || undefined;

/** Form thêm/sửa tài liệu. Số/ngày/nơi gửi-nhận chỉ hiện khi là văn bản đến hoặc đi. */
export function TaiLieuForm({ initialData, defaultHuong, onClose }: { initialData: TaiLieu | null; defaultHuong: Huong; onClose: () => void }) {
  const isEdit = !!initialData;
  const create = useCreateTaiLieu(onClose);
  const update = useUpdateTaiLieu(onClose);
  const { data: loai = [] } = useLoaiTaiLieu();
  const { data: trangThai = [] } = useTrangThaiTaiLieu();
  const { data: nhom = [] } = useNhomTaiLieu();
  const { data: departments = [] } = useDepartments();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: blank(defaultHuong) });
  const huong = watch('huong');

  useEffect(() => {
    reset(
      initialData
        ? {
            ma_so: initialData.ma_so ?? '',
            huong: initialData.huong,
            id_loai: initialData.id_loai,
            id_nhom_tai_lieu: initialData.id_nhom_tai_lieu ?? '',
            id_trang_thai: initialData.id_trang_thai,
            trich_yeu: initialData.trich_yeu,
            so_den: initialData.so_den ?? '',
            ngay_den: initialData.ngay_den ? toInputDate(initialData.ngay_den) : '',
            noi_gui: initialData.noi_gui ?? '',
            so_di: initialData.so_di ?? '',
            ngay_ky: initialData.ngay_ky ? toInputDate(initialData.ngay_ky) : '',
            noi_nhan: initialData.noi_nhan ?? '',
            id_phong_ban: initialData.id_phong_ban ?? '',
            ghi_chu: initialData.ghi_chu ?? '',
          }
        : blank(defaultHuong),
    );
  }, [initialData, defaultHuong, reset]);

  const active = (s: { trang_thai: string }) => s.trang_thai === 'Đang hoạt động';
  const loaiOptions = useMemo(() => loai.filter(active).map((x) => ({ label: x.ten, value: x.id })), [loai]);
  const trangThaiOptions = useMemo(() => trangThai.filter(active).map((x) => ({ label: x.ten, value: x.id })), [trangThai]);
  const nhomOptions = useMemo(() => nhom.filter(active).map((x) => ({ label: x.ten, value: x.id })), [nhom]);
  const deptOptions = useMemo(() => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })), [departments]);
  const huongOptions = HUONG_OPTIONS.map((h) => ({ label: t(h.labelKey), value: h.value }));
  const iconMuted = (Icon: typeof FileText) => <Icon size={16} className="text-muted-foreground" />;

  const submit = (v: FormValues) => {
    const data: TaiLieuInput = {
      ...v,
      ma_so: v.ma_so,
      ghi_chu: trimOrUndefined(v.ghi_chu),
      so_den: trimOrUndefined(v.so_den),
      noi_gui: trimOrUndefined(v.noi_gui),
      so_di: trimOrUndefined(v.so_di),
      noi_nhan: trimOrUndefined(v.noi_nhan),
      id_phong_ban: trimOrUndefined(v.id_phong_ban),
      id_nhom_tai_lieu: trimOrUndefined(v.id_nhom_tai_lieu),
    };
    if (isEdit && initialData) update.mutate({ id: initialData.id, data });
    else create.mutate(data);
  };

  return (
    <Drawer
      title={t(isEdit ? 'taiLieu.form.editTitle' : 'taiLieu.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="tai-lieu-form"
          onCancel={onClose}
          isLoading={create.isPending || update.isPending}
          isEdit={isEdit}
          saveLabel={t('taiLieu.form.save')}
          createLabel={t('taiLieu.form.create')}
        />
      }
    >
      <form id="tai-lieu-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('taiLieu.form.basicInfo')} icon={<FileText size={14} />}>
          <FormGrid cols={2}>
            <Input label={t('taiLieu.form.maSo')} placeholder={t('taiLieu.form.maSoPlaceholder')} icon={<Hash size={14} />} {...register('ma_so')} error={errors.ma_so?.message} />
            <Controller
              name="huong"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('taiLieu.store.huongCol')}
                  options={huongOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('taiLieu.store.huongCol')}
                  icon={iconMuted(Tag)}
                  required
                />
              )}
            />
            <Controller
              name="id_loai"
              control={control}
              render={({ field }) => (
                <Select label={t('taiLieu.form.loai')} options={loaiOptions} value={field.value} onChange={field.onChange} placeholder={t('taiLieu.form.loai')} icon={iconMuted(FileText)} required />
              )}
            />
            {errors.id_loai?.message && <p className="text-sm text-destructive col-span-2">{errors.id_loai.message}</p>}
            <Controller
              name="id_nhom_tai_lieu"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('taiLieu.form.nhomTaiLieu')}
                  options={[{ label: '—', value: '' }, ...nhomOptions]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v || undefined)}
                  placeholder={t('taiLieu.form.nhomTaiLieuPlaceholder')}
                  icon={iconMuted(FileText)}
                />
              )}
            />
            <Controller
              name="id_trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('taiLieu.form.trangThai')}
                  options={trangThaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('taiLieu.form.trangThai')}
                  icon={iconMuted(Tag)}
                  required
                />
              )}
            />
            {errors.id_trang_thai?.message && <p className="text-sm text-destructive col-span-2">{errors.id_trang_thai.message}</p>}
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('taiLieu.form.phongQuanLy')}
                  options={[{ label: '—', value: '' }, ...deptOptions]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v || undefined)}
                  placeholder={t('taiLieu.form.phongQuanLyPlaceholder')}
                  icon={iconMuted(FileText)}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('taiLieu.form.trichYeu')}
                placeholder={t('taiLieu.form.trichYeuPlaceholder')}
                icon={<Type size={14} />}
                required
                {...register('trich_yeu')}
                error={errors.trich_yeu?.message}
              />
            </div>
            {huong === 'den' && (
              <>
                <Input label={t('taiLieu.form.soDen')} icon={<Hash size={14} />} {...register('so_den')} />
                <Input type="date" label={t('taiLieu.form.ngayDen')} icon={<Calendar size={14} />} {...register('ngay_den')} />
                <div className="col-span-1 sm:col-span-2">
                  <Input label={t('taiLieu.form.noiGui')} {...register('noi_gui')} />
                </div>
              </>
            )}
            {huong === 'di' && (
              <>
                <Input label={t('taiLieu.form.soDi')} icon={<Hash size={14} />} {...register('so_di')} />
                <Input type="date" label={t('taiLieu.form.ngayKy')} icon={<Calendar size={14} />} {...register('ngay_ky')} />
                <div className="col-span-1 sm:col-span-2">
                  <Input label={t('taiLieu.form.noiNhan')} {...register('noi_nhan')} />
                </div>
              </>
            )}
            <div className="col-span-1 sm:col-span-2">
              <Textarea label={t('taiLieu.form.ghiChu')} {...register('ghi_chu')} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </Drawer>
  );
}
