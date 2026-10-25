import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Calendar, FileText, Mail, Printer, User } from 'lucide-react';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { Drawer, DRAWER_WIDTH } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DetailField, DetailFooter, DetailSection, FormFooter, FormGrid, FormSection, QuickActions } from '@/components/ui/Sections';
import { useUngVien } from '../tuyen-dung/data';
import { loaiThuColor, loaiThuLabel, useCreateThu, useJobLevels, useUpdateThu, type ThuGuiUngVien, type ThuGuiUngVienInput } from '../tuyen-dung/settings';

export const PREVIEW_BASE = '/thu-gui-ung-vien/preview';
export const letterPreviewUrl = (r: Pick<ThuGuiUngVien, 'id' | 'id_ung_vien' | 'loai_thu'>) =>
  `${PREVIEW_BASE}/${encodeURIComponent(r.id_ung_vien)}/${r.loai_thu}?letterId=${encodeURIComponent(r.id)}`;

export function LoaiThuBadge({ value, className = '' }: { value: string; className?: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${loaiThuColor(value)} ${className}`}>{loaiThuLabel(value)}</span>;
}

/* ---------- Chi tiết ---------- */

export function ThuDetail({ data, onClose, onEdit, onDelete }: { data: ThuGuiUngVien; onClose: () => void; onEdit: (r: ThuGuiUngVien) => void; onDelete?: (id: string) => void }) {
  const noData = t('common.noData');
  return (
    <Drawer
      title={data.ten_ung_vien ?? '—'}
      icon={<Mail size={20} />}
      subtitle={<LoaiThuBadge value={data.loai_thu} className="shrink-0" />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <DetailFooter
          onClose={onClose}
          onEdit={() => {
            onEdit(data);
            onClose();
          }}
          onDelete={
            onDelete
              ? () => {
                  onDelete(data.id);
                  onClose();
                }
              : undefined
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Mail size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_ung_vien ?? '—'}</h2>
            <LoaiThuBadge value={data.loai_thu} className="w-fit mt-0.5" />
          </div>
        </div>
        <QuickActions
          actions={[
            {
              label: t('thuGuiUngVien.detail.toolbar.printLetter'),
              icon: <Printer size={16} />,
              onClick: () => window.open(letterPreviewUrl(data), '_blank', 'noopener,noreferrer'),
              variant: 'primary',
            },
          ]}
          className="bg-card rounded-xl border border-border"
        />
        <DetailSection title={t('thuGuiUngVien.detail.basicInfo')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thuGuiUngVien.table.ungVien')} value={data.ten_ung_vien ?? '—'} icon={<User size={14} />} />
            <DetailField label={t('thuGuiUngVien.table.loaiPhieu')} value={<LoaiThuBadge value={data.loai_thu} className="w-fit" />} icon={<FileText size={14} />} />
            <div className="col-span-1 sm:col-span-2">
              <DetailField label={t('thuGuiUngVien.ghiChu')} value={data.ghi_chu ?? ''} emptyText={noData} />
            </div>
            <DetailField label={t('thuGuiUngVien.table.ngayTao')} value={formatDateTime(data.tg_tao)} />
            <DetailField label={t('thuGuiUngVien.updatedAt')} value={formatDateTime(data.tg_cap_nhat)} />
          </div>
        </DetailSection>
        {data.loai_thu === 'moi-nhan-viec' && (
          <DetailSection title={t('thuGuiUngVien.sectionJobOffer')} icon={<Briefcase size={14} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label={t('thuGuiUngVien.bacLuong')} value={data.bac_luong ?? ''} emptyText={noData} />
              <DetailField label={t('thuGuiUngVien.mucLuong')} value={data.muc_luong ?? ''} emptyText={noData} />
              <DetailField label={t('thuGuiUngVien.ngayNhanViec')} value={data.ngay_vao_lam ?? ''} icon={<Calendar size={14} />} emptyText={noData} />
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thuGuiUngVien.coCheKhac')} value={data.co_che_khac ?? ''} emptyText={noData} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thuGuiUngVien.ghiChuKhac')} value={data.ghi_chu_khac ?? ''} emptyText={noData} />
              </div>
            </div>
          </DetailSection>
        )}
      </div>
    </Drawer>
  );
}

/* ---------- Form ---------- */

const optText = z.string().optional().nullable();
const schema = z
  .object({
    id_ung_vien: z.string().min(1, { message: t('thuGuiUngVien.validation.ungVienRequired') }),
    loai_thu: z.union([z.enum(['tu-choi', 'moi-nhan-viec']), z.literal('')]).optional(),
    ghi_chu: optText,
    ngay_vao_lam: optText,
    bac_luong: optText,
    muc_luong: optText,
    co_che_khac: optText,
    ghi_chu_khac: optText,
  })
  .refine((e) => e.loai_thu === 'tu-choi' || e.loai_thu === 'moi-nhan-viec', { message: t('thuGuiUngVien.validation.loaiThuRequired'), path: ['loai_thu'] })
  .refine((e) => e.loai_thu !== 'moi-nhan-viec' || (typeof e.bac_luong === 'string' && e.bac_luong.trim().length > 0), { message: t('thuGuiUngVien.validation.bacLuongRequired'), path: ['bac_luong'] })
  .refine((e) => e.loai_thu !== 'moi-nhan-viec' || (typeof e.muc_luong === 'string' && e.muc_luong.trim().length > 0), { message: t('thuGuiUngVien.validation.mucLuongRequired'), path: ['muc_luong'] });
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { id_ung_vien: '', loai_thu: undefined, ghi_chu: null, ngay_vao_lam: null, bac_luong: null, muc_luong: null, co_che_khac: null, ghi_chu_khac: null };

export function ThuForm({ initialData, onClose }: { initialData?: ThuGuiUngVien; onClose: () => void }) {
  const isEdit = !!initialData;
  const { data: candidates = [] } = useUngVien();
  const { data: levels = [] } = useJobLevels();
  const create = useCreateThu(onClose);
  const update = useUpdateThu(onClose);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const loai = watch('loai_thu');

  useEffect(() => {
    reset(
      initialData
        ? {
            id_ung_vien: initialData.id_ung_vien,
            loai_thu: initialData.loai_thu,
            ghi_chu: initialData.ghi_chu ?? null,
            ngay_vao_lam: initialData.ngay_vao_lam ?? null,
            bac_luong: initialData.bac_luong ?? null,
            muc_luong: initialData.muc_luong ?? null,
            co_che_khac: initialData.co_che_khac ?? null,
            ghi_chu_khac: initialData.ghi_chu_khac ?? null,
          }
        : DEFAULTS,
    );
  }, [initialData, reset]);

  const candidateOptions = useMemo(() => candidates.map((c) => ({ label: `${c.ho_ten}${c.ten_chuc_vu ? ` · ${c.ten_chuc_vu}` : ''}`, value: c.id, subLabel: c.ten_chuc_vu })), [candidates]);
  const typeOptions = [
    { label: t('thuGuiUngVien.letterReject'), value: 'tu-choi' },
    { label: t('thuGuiUngVien.letterJobOffer'), value: 'moi-nhan-viec' },
  ];
  const levelOptions = useMemo(
    () => [
      { label: t('thuGuiUngVien.selectBacLuong'), value: '' },
      ...levels.filter((l) => l.trang_thai === 'Đang hoạt động').map((l) => ({ label: `${l.ma_cap_bac} - ${l.ten_cap_bac}`, value: `${l.ma_cap_bac} - ${l.ten_cap_bac}`, subLabel: l.ma_cap_bac })),
    ],
    [levels],
  );

  const submit = (f: FormValues) => {
    const offer = f.loai_thu === 'moi-nhan-viec';
    const keep = (v?: string | null) => (offer && v?.trim()) || null;
    const data: ThuGuiUngVienInput = {
      id_ung_vien: f.id_ung_vien,
      loai_thu: f.loai_thu as ThuGuiUngVienInput['loai_thu'],
      ghi_chu: f.ghi_chu?.trim() || null,
      ngay_vao_lam: keep(f.ngay_vao_lam),
      bac_luong: keep(f.bac_luong),
      muc_luong: keep(f.muc_luong),
      co_che_khac: keep(f.co_che_khac),
      ghi_chu_khac: keep(f.ghi_chu_khac),
    };
    if (isEdit && initialData) {
      const { id_ung_vien: _u, loai_thu: _l, ...rest } = data;
      update.mutate({ id: initialData.id, data: rest });
    } else create.mutate(data);
  };

  return (
    <Drawer
      title={t(isEdit ? 'thuGuiUngVien.edit' : 'thuGuiUngVien.add')}
      icon={<User size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH}
      footer={
        <FormFooter
          formId="thu-gui-ung-vien-form"
          onCancel={onClose}
          isLoading={create.isPending || update.isPending}
          isEdit={isEdit}
          saveLabel={t('thuGuiUngVien.save')}
          createLabel={t('thuGuiUngVien.save')}
        />
      }
    >
      <form id="thu-gui-ung-vien-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        <FormSection title={t('thuGuiUngVien.form.basicInfo')} icon={<FileText size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="id_ung_vien"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuGuiUngVien.table.ungVien')}
                  options={candidateOptions}
                  placeholder={t('ungVien.form.hoTen')}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isEdit}
                  error={errors.id_ung_vien?.message}
                  required
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="loai_thu"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thuGuiUngVien.table.loaiPhieu')}
                  options={typeOptions}
                  placeholder={t('thuGuiUngVien.selectLoaiThu')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={isEdit}
                  error={errors.loai_thu?.message}
                  required
                  searchable={false}
                  dropdownInPortal
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea label={t('thuGuiUngVien.ghiChu')} placeholder={t('thuGuiUngVien.ghiChu')} rows={3} {...register('ghi_chu')} error={errors.ghi_chu?.message} />
            </div>
          </FormGrid>
        </FormSection>
        {loai === 'moi-nhan-viec' && (
          <FormSection title={t('thuGuiUngVien.sectionJobOffer')} icon={<Briefcase size={14} />}>
            <FormGrid cols={2}>
              <Controller
                name="bac_luong"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('thuGuiUngVien.bacLuong')}
                    options={levelOptions}
                    placeholder={t('thuGuiUngVien.selectBacLuong')}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v || null)}
                    disabled={isEdit}
                    error={errors.bac_luong?.message}
                    required
                    dropdownInPortal
                  />
                )}
              />
              <Input label={t('thuGuiUngVien.mucLuong')} placeholder={t('thuGuiUngVien.mucLuongPlaceholder')} {...register('muc_luong')} error={errors.muc_luong?.message} required />
              <Input type="date" label={t('thuGuiUngVien.ngayNhanViec')} {...register('ngay_vao_lam')} error={errors.ngay_vao_lam?.message} required />
              <div className="col-span-1 sm:col-span-2">
                <Textarea label={t('thuGuiUngVien.coCheKhac')} placeholder={t('thuGuiUngVien.coCheKhacPlaceholder')} rows={2} {...register('co_che_khac')} error={errors.co_che_khac?.message} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Textarea label={t('thuGuiUngVien.ghiChuKhac')} placeholder={t('thuGuiUngVien.ghiChuKhacPlaceholder')} rows={2} {...register('ghi_chu_khac')} error={errors.ghi_chu_khac?.message} />
              </div>
            </FormGrid>
          </FormSection>
        )}
      </form>
    </Drawer>
  );
}
