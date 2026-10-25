import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm, type FieldArrayWithId, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Calendar, FileText, Mail, MapPin, Phone, SquarePen, Tag, Trash2, User } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormFooter, FormGrid, FormSection, TableSection, subTdActions, subTh, subThActions } from '@/components/ui/Sections';
import {
  deXuatLabel,
  useCreateUngVien,
  useDeXuatTuyenDung,
  useKenhTuyenDung,
  useTrangThaiUngVien,
  useUpdateUngVien,
  type UngVien,
  type UngVienInput,
} from '../tuyen-dung/data';

const taiLieuSchema = z.object({ id: z.string(), ten_file: z.string(), loai: z.string().optional(), link: z.string().optional() });
const schema = z.object({
  ho_ten: z.string().min(1, { message: t('ungVien.validation.hoTenRequired') }),
  email: z.string().min(1, { message: t('ungVien.validation.emailRequired') }).email(t('ungVien.validation.emailInvalid')),
  so_dien_thoai: z.string(),
  dia_chi: z.string().nullable(),
  ngay_sinh: z.string().nullable(),
  ghi_chu_noi_bo: z.string().nullable(),
  id_de_xuat_tuyen_dung: z.string().min(1, { message: t('ungVien.validation.viTriRequired') }),
  id_trang_thai_ung_vien: z.string().min(1, { message: t('ungVien.validation.trangThaiRequired') }),
  id_kenh_tuyen_dung: z.string().nullable(),
  ngay_phong_van_gan_nhat: z.string().nullable(),
  ket_qua_phan_hoi_gan_nhat: z.string().nullable(),
  tai_lieu: z.array(taiLieuSchema),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  ho_ten: '',
  email: '',
  so_dien_thoai: '',
  dia_chi: null,
  ngay_sinh: null,
  ghi_chu_noi_bo: null,
  id_de_xuat_tuyen_dung: '',
  id_trang_thai_ung_vien: '',
  id_kenh_tuyen_dung: null,
  ngay_phong_van_gan_nhat: null,
  ket_qua_phan_hoi_gan_nhat: null,
  tai_lieu: [],
};

const emptyToNull = (v: string | null | undefined) => (v === '' || v == null ? null : v);

/** Bảng tài liệu đính kèm có thể sửa trực tiếp trong form. */
function TaiLieuEditor({
  fields,
  register,
  onAdd,
  onRemove,
}: {
  fields: FieldArrayWithId<FormValues, 'tai_lieu'>[];
  register: UseFormRegister<FormValues>;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  const cellInput = 'h-9 text-sm border-border w-full min-w-0';
  return (
    <TableSection title={t('ungVien.form.taiLieu')} icon={<FileText size={14} className="text-primary" />} count={fields.length} addLabel={t('ungVien.form.addFile')} onAdd={onAdd}>
      <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
        <tr>
          <th className={subTh}>#</th>
          <th className={subTh}>{t('ungVien.form.tenFile')}</th>
          <th className={subTh}>{t('ungVien.form.loaiFile')}</th>
          <th className={subTh}>{t('ungVien.form.linkLabel')}</th>
          <th className={subThActions}>{t('ungVien.form.actionsCol')}</th>
        </tr>
      </thead>
      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
        {fields.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">
              {t('ungVien.detail.noDocuments')}
            </td>
          </tr>
        ) : (
          fields.map((f, i) => (
            <tr key={f.id} className="hover:bg-muted/60 transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
              <td className="px-4 py-2.5">
                <Input placeholder={t('ungVien.form.tenFile')} className={cellInput} {...register(`tai_lieu.${i}.ten_file`)} />
              </td>
              <td className="px-4 py-2.5">
                <Input placeholder={t('ungVien.form.loaiFile')} className={cellInput} {...register(`tai_lieu.${i}.loai`)} />
              </td>
              <td className="px-4 py-2.5">
                <Input placeholder={t('ungVien.form.linkPlaceholder')} className={cellInput} {...register(`tai_lieu.${i}.link`)} />
              </td>
              <td className={subTdActions} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-0.5">
                  <button type="button" className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.edit')} aria-label={t('common.edit')}>
                    <SquarePen size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                    title={t('common.delete')}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </TableSection>
  );
}

/** Form thêm/sửa ứng viên (ngăn kéo bên phải). */
export function UngVienForm({ initialData, initialIdDeXuat, onClose }: { initialData: UngVien | null; initialIdDeXuat?: string; onClose: () => void }) {
  const isEdit = !!initialData;
  const { data: proposals = [] } = useDeXuatTuyenDung();
  const { data: statuses = [] } = useTrangThaiUngVien();
  const { data: sources = [] } = useKenhTuyenDung();
  const create = useCreateUngVien(onClose);
  const update = useUpdateUngVien(onClose);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const { fields, append, remove } = useFieldArray({ control, name: 'tai_lieu' });

  const proposalOptions = useMemo(() => proposals.map((p) => ({ label: deXuatLabel(p), value: p.id, subLabel: p.ma_de_xuat })), [proposals]);
  const statusOptions = useMemo(() => statuses.map((s) => ({ label: s.ten, value: s.id })), [statuses]);
  const sourceOptions = useMemo(() => [{ label: t('ungVien.form.kenhPlaceholder'), value: '' }, ...sources.map((s) => ({ label: s.ten, value: s.id }))], [sources]);

  useEffect(() => {
    reset(
      initialData
        ? {
            ho_ten: initialData.ho_ten,
            email: initialData.email,
            so_dien_thoai: initialData.so_dien_thoai ?? '',
            dia_chi: initialData.dia_chi ?? null,
            ngay_sinh: initialData.ngay_sinh ?? null,
            ghi_chu_noi_bo: initialData.ghi_chu_noi_bo ?? null,
            id_de_xuat_tuyen_dung: initialData.id_de_xuat_tuyen_dung,
            id_trang_thai_ung_vien: initialData.id_trang_thai_ung_vien,
            id_kenh_tuyen_dung: initialData.id_kenh_tuyen_dung ?? null,
            ngay_phong_van_gan_nhat: initialData.ngay_phong_van_gan_nhat ? initialData.ngay_phong_van_gan_nhat.slice(0, 16) : null,
            ket_qua_phan_hoi_gan_nhat: initialData.ket_qua_phan_hoi_gan_nhat ?? null,
            tai_lieu: initialData.tai_lieu?.length ? initialData.tai_lieu.map((d) => ({ ...d, loai: d.loai ?? '', link: d.link ?? '' })) : [],
          }
        : { ...DEFAULTS, id_de_xuat_tuyen_dung: initialIdDeXuat ?? '' },
    );
  }, [initialData, initialIdDeXuat, reset]);

  const submit = (v: FormValues) => {
    const data: UngVienInput = {
      ...v,
      dia_chi: emptyToNull(v.dia_chi),
      ngay_sinh: emptyToNull(v.ngay_sinh),
      ghi_chu_noi_bo: emptyToNull(v.ghi_chu_noi_bo),
      id_kenh_tuyen_dung: emptyToNull(v.id_kenh_tuyen_dung),
      ngay_phong_van_gan_nhat: emptyToNull(v.ngay_phong_van_gan_nhat),
      ket_qua_phan_hoi_gan_nhat: emptyToNull(v.ket_qua_phan_hoi_gan_nhat),
      tai_lieu: (v.tai_lieu ?? []).filter((d) => d.ten_file?.trim()),
    };
    if (isEdit && initialData) update.mutate({ id: initialData.id, data });
    else create.mutate(data);
  };

  return (
    <Drawer
      title={t(isEdit ? 'ungVien.form.editTitle' : 'ungVien.form.createTitle')}
      icon={<User size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="ung-vien-form"
          onCancel={onClose}
          isLoading={create.isPending || update.isPending}
          isEdit={isEdit}
          saveLabel={t('ungVien.form.save')}
          createLabel={t('ungVien.form.create')}
        />
      }
    >
      <form id="ung-vien-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('ungVien.form.basicInfo')} icon={<User size={14} />}>
          <FormGrid cols={2}>
            <Input
              label={t('ungVien.form.hoTen')}
              placeholder={t('ungVien.form.hoTenPlaceholder')}
              icon={<User size={14} />}
              required
              {...register('ho_ten')}
              error={errors.ho_ten?.message}
            />
            <Input
              label={t('ungVien.form.email')}
              placeholder={t('ungVien.form.emailPlaceholder')}
              type="email"
              icon={<Mail size={14} />}
              required
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('ungVien.form.soDienThoai')}
              placeholder={t('ungVien.form.soDienThoaiPlaceholder')}
              icon={<Phone size={14} />}
              {...register('so_dien_thoai')}
              error={errors.so_dien_thoai?.message}
            />
            <Input
              label={t('ungVien.form.diaChi')}
              placeholder={t('ungVien.form.diaChiPlaceholder')}
              icon={<MapPin size={14} />}
              {...register('dia_chi')}
              error={errors.dia_chi?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input label={t('ungVien.form.ngaySinh')} type="date" icon={<Calendar size={14} />} {...register('ngay_sinh')} error={errors.ngay_sinh?.message} />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('ungVien.detail.viTriUngTuyen')} icon={<Briefcase size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="id_de_xuat_tuyen_dung"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('ungVien.form.viTriUngTuyen')}
                  options={proposalOptions}
                  placeholder={t('ungVien.form.viTriPlaceholder')}
                  icon={<Briefcase size={14} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.id_de_xuat_tuyen_dung?.message}
                  required
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="id_trang_thai_ung_vien"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('ungVien.form.trangThai')}
                  options={statusOptions}
                  placeholder={t('ungVien.form.trangThaiPlaceholder')}
                  icon={<Tag size={14} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.id_trang_thai_ung_vien?.message}
                  required
                  dropdownInPortal
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_kenh_tuyen_dung"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('ungVien.form.kenhTuyenDung')}
                    options={sourceOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v === '' ? null : v)}
                    placeholder={t('ungVien.form.kenhPlaceholder')}
                    icon={<Briefcase size={14} />}
                    dropdownInPortal
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('ungVien.detail.phongVanGanNhat')} icon={<Calendar size={14} />}>
          <FormGrid cols={2}>
            <Input label={t('ungVien.form.ngayPhongVanGanNhat')} type="datetime-local" {...register('ngay_phong_van_gan_nhat')} error={errors.ngay_phong_van_gan_nhat?.message} />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('ungVien.form.ketQuaPhongVanGanNhat')}
                placeholder={t('ungVien.form.ketQuaPlaceholder')}
                {...register('ket_qua_phan_hoi_gan_nhat')}
                error={errors.ket_qua_phan_hoi_gan_nhat?.message}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('ungVien.form.ghiChuNoiBo')} icon={<FileText size={14} />}>
          <Textarea placeholder={t('ungVien.form.ghiChuPlaceholder')} {...register('ghi_chu_noi_bo')} error={errors.ghi_chu_noi_bo?.message} rows={3} />
        </FormSection>
        <TaiLieuEditor fields={fields} register={register} onAdd={() => append({ id: `tl-${Date.now()}`, ten_file: '', loai: '', link: '' })} onRemove={remove} />
      </form>
    </Drawer>
  );
}
